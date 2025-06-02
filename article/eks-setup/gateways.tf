# internet gateway
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.eks_vpc.id

  tags = {
    Name = "${var.env}-igw"
  }
}

# nat gateway
resource "aws_eip" "nat" {
  domain = "vpc"

  tags = {
    Name = "${var.env}-nat"
  }
}

resource "aws_nat_gateway" "nat" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public_zone1.id

  tags = {
    Name = "${var.env}-nat"
  }

  depends_on = [aws_internet_gateway.igw]
}