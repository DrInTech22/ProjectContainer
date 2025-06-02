resource "aws_eip" "nat-eip" {
  domain        = "vpc"
  depends_on    = [aws_internet_gateway.igw]
}

resource "aws_nat_gateway" "nat-gw" {
  allocation_id = aws_eip.nat-eip.id
  subnet_id     = aws_subnet.public_subnet[0].id

  tags          = {
    Name        = var.natgw-name
  }

  depends_on    = [aws_internet_gateway.igw]
}