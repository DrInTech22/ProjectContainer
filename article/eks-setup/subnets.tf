resource "aws_subnet" "private_zone1" {
  vpc_id            = aws_vpc.eks_vpc.id
  cidr_block        = "10.0.0.0/19"
  availability_zone = var.zone1

  tags = {
    "Name"                                                 = "${var.env}-private-${var.zone1}"
    "kubernetes.io/role/internal-elb"                      = "1"
    "kubernetes.io/cluster/${var.env}-${local.eks_name}"   = "owned"
  }
}

resource "aws_subnet" "private_zone2" {
  vpc_id            = aws_vpc.eks_vpc.id
  cidr_block        = "10.0.32.0/19"
  availability_zone = var.zone2

  tags = {
    "Name"                                                 = "${var.env}-private-${var.zone2}"
    "kubernetes.io/role/internal-elb"                      = "1"
    "kubernetes.io/cluster/${var.env}-${local.eks_name}"   = "owned"
  }
}

resource "aws_subnet" "public_zone1" {
  vpc_id                  = aws_vpc.eks_vpc.id
  cidr_block              = "10.0.64.0/19"
  availability_zone       = var.zone1
  map_public_ip_on_launch = true

  tags = {
    "Name"                                                 = "${var.env}-public-${var.zone1}"
    "kubernetes.io/role/elb"                               = "1"
    "kubernetes.io/cluster/${var.env}-${local.eks_name}"   = "owned"
  }
}

resource "aws_subnet" "public_zone2" {
  vpc_id                  = aws_vpc.eks_vpc.id
  cidr_block              = "10.0.96.0/19"
  availability_zone       = var.zone2
  map_public_ip_on_launch = true

  tags = {
    "Name"                                                 = "${var.env}-public-${var.zone2}"
    "kubernetes.io/role/elb"                               = "1"
    "kubernetes.io/cluster/${var.env}-${local.eks_name}"   = "owned"
  }
}

# routes
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.eks_vpc.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat.id
  }

  tags = {
    Name = "${var.env}-private"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.eks_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = {
    Name = "${var.env}-public"
  }
}

resource "aws_route_table_association" "private_zone1" {
  subnet_id      = aws_subnet.private_zone1.id
  route_table_id = aws_route_table.private.id
}

resource "aws_route_table_association" "private_zone2" {
  subnet_id      = aws_subnet.private_zone2.id
  route_table_id = aws_route_table.private.id
}

resource "aws_route_table_association" "public_zone1" {
  subnet_id      = aws_subnet.public_zone1.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_zone2" {
  subnet_id      = aws_subnet.public_zone2.id
  route_table_id = aws_route_table.public.id
}